import React from "react";
import { Select } from "antd";
const { Option } = Select;

const YearSelect = ({ selectedYear, onYearChange, availableYears }) => {
  return (
    <Select
      style={{ width: 80 }}
      placement="bottom"
      value={selectedYear}
      onChange={onYearChange}>
      {availableYears.map((year) => (
        <Option key={year} value={year}>
          {year}
        </Option>
      ))}
    </Select>
  );
};

export default YearSelect;
