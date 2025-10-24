import React from "react";
import DatePicker from "react-datepicker";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "../../lib/utils";

const SimpleDatePicker = ({ date, setDate, placeholder = "Select date" }) => {
  return (
    <div className="relative w-full">
      <DatePicker
        selected={date}
        onChange={(newDate) => setDate(newDate)}
        dateFormat="PPP"
        placeholderText={placeholder}
        className={cn(
          "w-full px-4 py-3 sm:px-6 sm:py-4 border border-slate-500/50 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-slate-800/20 backdrop-blur-sm text-slate-200 shadow-lg transition-all duration-300 text-left text-sm sm:text-base",
          !date && "text-slate-400"
        )}
        calendarClassName="react-datepicker-custom-calendar"
        dayClassName={() => "react-datepicker__day"}
        minDate={new Date()}
      />
      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none" />
    </div>
  );
};

export default SimpleDatePicker;
