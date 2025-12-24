import React, { useState } from "react";
import { Icon } from "./ui/Icon";
import { usePnlCalendar } from "../hooks/useTrades";
import { Tooltip } from "antd";

interface CalendarProps { }

interface PnlData {
  date: string;
  pnl: number;
  returns: number;
  count: number;
}

const PnlCalendar: React.FC<CalendarProps> = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data: pnlDataArray, isLoading: loading } = usePnlCalendar(
    month + 1,
    year
  );

  const pnlData: Record<string, PnlData> = {};
  if (pnlDataArray) {
    pnlDataArray.forEach((item) => {
      pnlData[item.date] = item;
    });
  }

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Generate array for calendar grid
  const days = [];
  // Padding for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formatDateKey = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  };

  return (
    <div className="bg-surface rounded-2xl p-6 border border-gray-700 shadow-xl mt-2">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Trading Calendar
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-surface-highlight rounded-full transition-colors text-white cursor-pointer"
          >
            <Icon name="left-arrow" size={{ height: 20, width: 20 }} />
          </button>
          <span className="text-lg font-semibold min-w-[140px] text-center text-white cursor-pointer">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-surface-highlight rounded-full transition-colors text-white cursor-pointer"
          >
            <Icon name="right-arrow" size={{ height: 20, width: 20 }} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-secondary text-sm font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[650px] justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-4">
          {days.map((day, index) => {
            if (day === null)
              return (
                <div
                  key={`empty-${index}`}
                  className="h-24 rounded-xl bg-surface/30"
                ></div>
              );

            const dateKey = formatDateKey(day);
            const data = pnlData[dateKey];
            const returns = data ? data.returns : 0;
            const count = data ? data.count : 0;
            const hasTrade = !!data;

            let bgColor = "bg-surface-highlight/20";
            let textColor = "text-secondary";

            if (hasTrade) {
              if (returns > 0) {
                bgColor = "bg-green-500/10 border border-green-500/30";
                textColor = "text-green-500";
              } else if (returns < 0) {
                bgColor = "bg-red-500/10 border border-red-500/30";
                textColor = "text-red-500";
              } else {
                bgColor = "bg-gray-500/10 border border-gray-500/30";
                textColor = "text-gray-400";
              }
            }

            return (
              <Tooltip title={
                count !== 0 && <div>
                  Total returns: {returns.toFixed(2)}%
                  <br />
                  Total trades: {count}
                  <br />
                  Total PnL: {data?.pnl.toFixed(2)}
                </div>
              }>
                <div
                  key={day}
                  className={`h-24 cursor-pointer hover:border-[1px] hover:border-gray-600 rounded-xl p-3 flex flex-col justify-between transition-all hover:scale-105 ${bgColor}`}
                >
                  <div className="text-right">
                    <span
                      className={`text-sm ${hasTrade ? "text-white" : "text-gray-600"
                        }`}
                    >
                      {day}
                    </span>
                  </div>

                  {hasTrade && (
                    <div>
                      <div className={`text-lg font-bold ${textColor}`}>
                        {returns > 0 ? "+" : ""}
                        {returns.toFixed(2)}%
                      </div>
                      <div className="text-xs text-secondary/70">
                        {count} trade{count !== 1 ? "s" : ""}
                      </div>
                    </div>
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PnlCalendar;
