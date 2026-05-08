import os
import shutil
from pathlib import Path

from app.config import BACKEND_ROOT, settings

JAVA_SETUP_MESSAGE = (
    "Java is required for Spark processing. Install a JDK and set JAVA_HOME "
    "to the JDK folder, then restart the backend."
)
POSTGRES_JDBC_MESSAGE = (
    "PostgreSQL JDBC driver is required for Spark database writes. Put "
    "postgresql-42.x.x.jar in backend/jars or set POSTGRES_JDBC_JAR."
)
HADOOP_SETUP_MESSAGE = (
    "Spark on Windows requires winutils.exe. Put winutils.exe in "
    "backend/hadoop/bin or set HADOOP_HOME to a Hadoop folder containing bin/winutils.exe."
)


def check_java_runtime():
    java_home = settings.JAVA_HOME or os.getenv("JAVA_HOME")
    if java_home:
        java_path = Path(java_home)
        java_executable = java_path / "bin" / ("java.exe" if os.name == "nt" else "java")
        if java_executable.exists():
            os.environ["JAVA_HOME"] = str(java_path)
            return {
                "status": "ok",
                "java_home": str(java_path),
                "java": str(java_executable),
            }

        return {
            "status": "error",
            "error": "JavaNotFound",
            "detail": f"JAVA_HOME is set to '{java_home}', but Java was not found at '{java_executable}'.",
        }

    java_on_path = shutil.which("java")
    if java_on_path:
        return {
            "status": "ok",
            "java": java_on_path,
        }

    return {
        "status": "error",
        "error": "JavaNotFound",
        "detail": JAVA_SETUP_MESSAGE,
    }


def find_postgres_jdbc_jar():
    configured_path = settings.POSTGRES_JDBC_JAR or os.getenv("POSTGRES_JDBC_JAR")
    if configured_path:
        jar_path = Path(configured_path)
        if jar_path.exists():
            return jar_path

    jars_dir = BACKEND_ROOT / "jars"
    jars = sorted(jars_dir.glob("postgresql-*.jar"))
    if jars:
        return jars[-1]

    return None


def check_postgres_jdbc_driver():
    jar_path = find_postgres_jdbc_jar()
    if jar_path:
        return {
            "status": "ok",
            "path": str(jar_path),
        }

    return {
        "status": "error",
        "error": "PostgresJdbcDriverNotFound",
        "detail": POSTGRES_JDBC_MESSAGE,
    }


def find_hadoop_home():
    configured_home = settings.HADOOP_HOME or os.getenv("HADOOP_HOME") or os.getenv("hadoop.home.dir")
    if configured_home:
        hadoop_home = Path(configured_home)
        winutils_path = hadoop_home / "bin" / "winutils.exe"
        if winutils_path.exists():
            return hadoop_home

    local_hadoop_home = BACKEND_ROOT / "hadoop"
    local_winutils = local_hadoop_home / "bin" / "winutils.exe"
    if local_winutils.exists():
        return local_hadoop_home

    return None


def configure_hadoop_home():
    hadoop_home = find_hadoop_home()
    if hadoop_home:
        os.environ["HADOOP_HOME"] = str(hadoop_home)
        os.environ["hadoop.home.dir"] = str(hadoop_home)
    return hadoop_home


def check_hadoop_runtime():
    hadoop_home = configure_hadoop_home()
    if hadoop_home:
        return {
            "status": "ok",
            "hadoop_home": str(hadoop_home),
            "winutils": str(hadoop_home / "bin" / "winutils.exe"),
        }

    return {
        "status": "error",
        "error": "WinutilsNotFound",
        "detail": HADOOP_SETUP_MESSAGE,
    }
