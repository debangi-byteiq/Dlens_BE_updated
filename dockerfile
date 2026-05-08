FROM apache/spark:3.4.4

USER root

RUN apt-get update && \
    apt-get install -y wget build-essential libffi-dev libssl-dev zlib1g-dev \
    libbz2-dev libreadline-dev libsqlite3-dev curl procps gcc python3-dev libpq-dev \
    net-tools openjdk-11-jdk && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
RUN echo "export JAVA_HOME=${JAVA_HOME}" >> /etc/profile && \
    echo "export JAVA_HOME=${JAVA_HOME}" >> ~/.bashrc

RUN wget https://www.python.org/ftp/python/3.11.4/Python-3.11.4.tgz && \
    tar -xzf Python-3.11.4.tgz && \
    cd Python-3.11.4 && \
    ./configure --enable-optimizations && \
    make -j $(nproc) && \
    make altinstall && \
    ln -sf /usr/local/bin/python3.11 /usr/bin/python3 && \
    ln -sf /usr/bin/python3 /usr/bin/python && \
    cd .. && \
    rm -rf Python-3.11.4 Python-3.11.4.tgz

RUN python3 -m pip install --upgrade pip

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p $SPARK_HOME/jars $SPARK_HOME/conf && \
    cd $SPARK_HOME/jars && \
    wget https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.28/mysql-connector-java-8.0.28.jar && \
    wget https://jdbc.postgresql.org/download/postgresql-42.6.0.jar && \
    wget https://repo1.maven.org/maven2/com/microsoft/sqlserver/mssql-jdbc/9.4.1.jre11/mssql-jdbc-9.4.1.jre11.jar

RUN pip install pyspark==3.4.4

ENV PYSPARK_PYTHON=/usr/bin/python3
ENV PYSPARK_DRIVER_PYTHON=/usr/bin/python3
ENV PYTHONIOENCODING=UTF-8
ENV PYTHONPATH=$SPARK_HOME/python:$SPARK_HOME/python/lib/py4j-0.10.9.5-src.zip:$PYTHONPATH
ENV PYSPARK_SUBMIT_ARGS="--jars $SPARK_HOME/jars/*.jar pyspark-shell"

RUN echo "spark.driver.memory 2g" > $SPARK_HOME/conf/spark-defaults.conf && \
    echo "spark.executor.memory 2g" >> $SPARK_HOME/conf/spark-defaults.conf && \
    echo "spark.sql.shuffle.partitions 10" >> $SPARK_HOME/conf/spark-defaults.conf && \
    echo "spark.driver.extraClassPath $SPARK_HOME/jars/*" >> $SPARK_HOME/conf/spark-defaults.conf && \
    echo "spark.executor.extraClassPath $SPARK_HOME/jars/*" >> $SPARK_HOME/conf/spark-defaults.conf && \
    echo "spark.driver.extraJavaOptions -Dlog4j.configuration=file:/app/log4j.properties" >> $SPARK_HOME/conf/spark-defaults.conf && \
    echo "spark.executor.extraJavaOptions -Dlog4j.configuration=file:/app/log4j.properties" >> $SPARK_HOME/conf/spark-defaults.conf

RUN echo "log4j.rootCategory=ERROR, console" > /app/log4j.properties && \
    echo "log4j.appender.console=org.apache.log4j.ConsoleAppender" >> /app/log4j.properties && \
    echo "log4j.appender.console.target=System.err" >> /app/log4j.properties && \
    echo "log4j.appender.console.layout=org.apache.log4j.PatternLayout" >> /app/log4j.properties && \
    echo "log4j.appender.console.layout.ConversionPattern=%d{yy/MM/dd HH:mm:ss} %p %c{1}: %m%n" >> /app/log4j.properties && \
    echo "log4j.logger.org.apache.spark=ERROR" >> /app/log4j.properties

COPY . .

RUN mkdir -p uploaded_files/excel

RUN java -version && \
    echo "JAVA_HOME: $JAVA_HOME" && \
    ls -la $SPARK_HOME/bin || echo "Spark bin directory not found"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]