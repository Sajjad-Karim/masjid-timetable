import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import SimpleDatePicker from "./ui/simple-date-picker";
import {
  Upload,
  Calendar,
  FileText,
  Copy,
  Check,
  AlertCircle,
  CheckCircle,
  Clock,
  Sun,
  Moon,
  Star,
  Sparkles,
  Zap,
  Shield,
} from "lucide-react";
import * as XLSX from "xlsx";

const TimetableConverter = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [jsonOutput, setJsonOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [particles, setParticles] = useState([]);
  const fileInputRef = useRef(null);

  // Initialize animations on mount
  useEffect(() => {
    setIsLoaded(true);
    generateParticles();
  }, []);

  // Generate floating particles
  const generateParticles = () => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
    }));
    setParticles(newParticles);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      if (
        validTypes.includes(file.type) ||
        file.name.toLowerCase().endsWith(".xlsx") ||
        file.name.toLowerCase().endsWith(".xls")
      ) {
        setSelectedFile(file);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert("Please select a valid Excel file (.xlsx or .xls)");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      if (
        validTypes.includes(file.type) ||
        file.name.toLowerCase().endsWith(".xlsx") ||
        file.name.toLowerCase().endsWith(".xls")
      ) {
        setSelectedFile(file);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert("Please select a valid Excel file (.xlsx or .xls)");
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragActive(false);
  };

  const convertTimeTo24Hour = (raw, prayerKey) => {
    if (raw === undefined || raw === null || raw === "") return "";

    // Excel numeric time (fraction of a day)
    if (typeof raw === "number") {
      const totalMinutes = Math.round(raw * 24 * 60);
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    }

    // Normalize separators and trim
    let time = String(raw).trim();
    time = time.replace(/[\.\s]/g, ":"); // support "1.30" or "1 30"

    // Already HH:MM with no AM/PM → infer from prayerKey
    if (/^\d{1,2}:\d{2}$/.test(time) && !/(am|pm)/i.test(time)) {
      const [h, m] = time.split(":");
      let hours = parseInt(h, 10);
      const minutes = Math.min(59, Math.max(0, parseInt(m, 10)));

      if (prayerKey === "dhuhr") {
        // Special rule:
        // 11:00-11:59 => AM (stay 11:xx)
        // 12:00-12:59 => PM (stay 12:xx)
        // 1:00-10:59 => PM (add 12)
        if (hours >= 1 && hours <= 10) {
          hours += 12;
        }
        // hours 11 -> 11, hours 12 -> 12
      } else {
        const isMorningPrayer = prayerKey === "fajr" || prayerKey === "sunrise";
        if (!isMorningPrayer && hours >= 1 && hours <= 11) {
          hours += 12;
        }
      }

      if (hours === 24) hours = 0;
      hours = Math.min(23, Math.max(0, hours));
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    }

    // 12-hour H:MM AM/PM
    const timeRegex = /(\d{1,2}):(\d{1,2})\s*(AM|PM)/i;
    const match = time.match(timeRegex);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      if (period === "AM" && hours === 12) hours = 0;
      if (period === "PM" && hours !== 12) hours += 12;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    }

    return "";
  };

  const enforceAfternoonForNonMorning = (hhmm, prayerKey) => {
    if (!hhmm) return "";
    if (prayerKey === "fajr" || prayerKey === "sunrise") return hhmm;
    const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return hhmm;
    let hours = parseInt(m[1], 10);
    const minutes = m[2];

    if (prayerKey === "dhuhr") {
      // Apply Dhuhr rule after base conversion
      if (hours >= 1 && hours <= 10) {
        hours += 12; // 1-10 treated as PM
      }
      // 11 stays 11 (AM), 12 stays 12 (PM)
    } else {
      if (hours >= 1 && hours <= 11) hours += 12;
    }

    if (hours === 24) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  };

  const looksLikeTimeCell = (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "number") return true; // numeric excel time
    const s = String(value).trim();
    if (/^\d{1,2}:\d{2}(\s*(AM|PM))?$/i.test(s)) return true;
    return false;
  };

  const findFirstDataRowIndex = (rows) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] || [];
      const timeLikeCount = row.reduce(
        (acc, cell) => acc + (looksLikeTimeCell(cell) ? 1 : 0),
        0
      );
      // If a row has at least 3 time-like cells, treat it as the first data row
      if (timeLikeCount >= 3) return i;
    }
    return 1; // fallback
  };

  const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const generateJSON = async () => {
    if (!selectedFile || !startDate) {
      alert("Please select an Excel file and choose a start date");
      return;
    }

    setIsProcessing(true);
    setJsonOutput("");

    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const arrayBuffer = e.target.result;
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), {
              type: "array",
            });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(selectedFile);
      });

      // Skip header rows dynamically and filter out empty rows
      const startIdx = findFirstDataRowIndex(data);
      const timetableData = data
        .slice(startIdx)
        .filter((row) => row && row.length > 0);

      if (timetableData.length === 0) {
        alert("No data found in the Excel file. Please check the file format.");
        return;
      }

      const result = {};

      timetableData.forEach((row, index) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + index);
        const dateKey = formatDateToYYYYMMDD(currentDate);

        // Ensure we have at least 10 columns for all prayer times
        const paddedRow = [
          ...row,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ].slice(0, 10);

        result[dateKey] = {
          fajr: {
            start: convertTimeTo24Hour(paddedRow[0] || "", "fajr"),
            jamat: convertTimeTo24Hour(paddedRow[1] || "", "fajr"),
          },
          sunrise: {
            start: convertTimeTo24Hour(paddedRow[2] || "", "sunrise"),
          },
          dhuhr: {
            start: enforceAfternoonForNonMorning(
              convertTimeTo24Hour(paddedRow[3] || "", "dhuhr"),
              "dhuhr"
            ),
            jamat: enforceAfternoonForNonMorning(
              convertTimeTo24Hour(paddedRow[4] || "", "dhuhr"),
              "dhuhr"
            ),
          },
          asr: {
            start: enforceAfternoonForNonMorning(
              convertTimeTo24Hour(paddedRow[5] || "", "asr"),
              "asr"
            ),
            jamat: enforceAfternoonForNonMorning(
              convertTimeTo24Hour(paddedRow[6] || "", "asr"),
              "asr"
            ),
          },
          maghrib: {
            start: enforceAfternoonForNonMorning(
              convertTimeTo24Hour(paddedRow[7] || "", "maghrib"),
              "maghrib"
            ),
          },
          isha: {
            start: enforceAfternoonForNonMorning(
              convertTimeTo24Hour(paddedRow[8] || "", "isha"),
              "isha"
            ),
            jamat: enforceAfternoonForNonMorning(
              convertTimeTo24Hour(paddedRow[9] || "", "isha"),
              "isha"
            ),
          },
        };
      });

      // Pretty-print a single JSON object with each date on its own line, comma-separated
      const entries = Object.entries(result).map(([dateKey, obj]) => {
        return `  "${dateKey}": ${JSON.stringify(obj)}`;
      });
      const pretty = `{\n${entries.join(",\n")}\n}`;
      setJsonOutput(pretty);
    } catch (error) {
      console.error("Error processing file:", error);
      alert(
        "Error processing the Excel file. Please check the file format and ensure it contains prayer time data."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([jsonOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timetable.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    setSelectedFile(null);
    setStartDate(null);
    setJsonOutput("");
    setCopied(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs - Responsive sizing */}
        <div className="absolute top-0 -left-4 w-48 h-48 sm:w-72 sm:h-72 bg-slate-700 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-48 h-48 sm:w-72 sm:h-72 bg-gray-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-48 h-48 sm:w-72 sm:h-72 bg-slate-800 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

        {/* Floating Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-slate-400 rounded-full opacity-20 animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
            }}
          ></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-3 sm:p-6 lg:p-8">
        {/* Header with Advanced Animations */}
        <div
          className={`text-center mb-12 sm:mb-16 lg:mb-20 transition-all duration-2000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-r from-slate-700 via-gray-700 to-slate-800 rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 lg:mb-10 shadow-2xl">
            <Moon className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-slate-200" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black bg-gradient-to-r from-slate-300 via-gray-200 to-slate-400 bg-clip-text text-transparent mb-4 sm:mb-6 lg:mb-8 animate-gradient-x leading-tight px-4">
            Masjid Timetable Converter
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed animate-fade-in-up mb-2 sm:mb-3 lg:mb-4 px-4">
            Transform your Excel prayer timetables into professional JSON format
            with precision
          </p>
          <p className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed animate-fade-in-up px-4">
            Designed specifically for masjid management systems with automated
            time conversion and date progression
          </p>

          {/* Feature Badges - Responsive Grid */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 lg:gap-6 mt-8 sm:mt-10 lg:mt-12 px-4">
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-800/60 backdrop-blur-sm rounded-full px-4 py-2 sm:px-6 sm:py-3 animate-slide-in-left border border-slate-600/30">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-slate-600/50 rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300" />
              </div>
              <span className="text-slate-200 text-xs sm:text-sm font-semibold">
                Lightning Fast
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-800/60 backdrop-blur-sm rounded-full px-4 py-2 sm:px-6 sm:py-3 animate-slide-in-right border border-slate-600/30">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-slate-600/50 rounded-full flex items-center justify-center">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300" />
              </div>
              <span className="text-slate-200 text-xs sm:text-sm font-semibold">
                Secure Processing
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-800/60 backdrop-blur-sm rounded-full px-4 py-2 sm:px-6 sm:py-3 animate-slide-in-up border border-slate-600/30">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-slate-600/50 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300" />
              </div>
              <span className="text-slate-200 text-xs sm:text-sm font-semibold">
                Smart Conversion
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div
          className={`bg-slate-800/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-600/30 p-4 sm:p-6 lg:p-8 xl:p-12 space-y-8 sm:space-y-12 lg:space-y-16 transition-all duration-2000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* File Upload Section */}
          <div className="space-y-6 sm:space-y-8 lg:space-y-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-slate-600 to-gray-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Upload className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-slate-200" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-200">
                  Upload Excel File
                </h2>
                <p className="text-slate-400 text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                  Select your prayer timetable spreadsheet
                </p>
              </div>
            </div>

            <div
              className={`relative border-2 border-dashed rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-center transition-all duration-500 ${
                selectedFile
                  ? "border-slate-400 bg-gradient-to-br from-slate-600/20 to-gray-600/20 shadow-2xl"
                  : dragActive
                  ? "border-slate-500 bg-gradient-to-br from-slate-600/20 to-gray-600/20 shadow-2xl"
                  : "border-slate-600/50 hover:border-slate-500 hover:shadow-xl"
              }`}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-4 sm:space-y-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-slate-600 to-gray-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-bounce">
                    <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-slate-200" />
                  </div>
                  <div>
                    <p className="text-slate-300 font-bold text-lg sm:text-xl lg:text-2xl break-all">
                      {selectedFile.name}
                    </p>
                    <p className="text-slate-400 text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                      File uploaded successfully
                    </p>
                    <p className="text-slate-500 text-xs sm:text-sm mt-2 sm:mt-3">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  {showSuccess && (
                    <div className="absolute inset-0 bg-slate-600/20 rounded-2xl sm:rounded-3xl animate-ping"></div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl flex items-center justify-center transition-all duration-300 ${
                      dragActive
                        ? "bg-gradient-to-r from-slate-600 to-gray-600"
                        : "bg-gradient-to-r from-slate-700/50 to-gray-700/50"
                    }`}
                  >
                    <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-bold text-lg sm:text-xl lg:text-2xl">
                      {dragActive
                        ? "Drop your file here"
                        : "Drag and drop your Excel file"}
                    </p>
                    <p className="text-slate-400 text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                      or click to browse files
                    </p>
                    <p className="text-slate-500 text-xs sm:text-sm mt-2 sm:mt-3">
                      Supports .xlsx and .xls formats
                    </p>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className={`mt-6 sm:mt-8 h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold transition-all duration-300 ${
                  selectedFile
                    ? "bg-slate-600/20 border-slate-400 text-slate-300 hover:bg-slate-600/30"
                    : "bg-slate-700/20 border-slate-500 text-slate-200 hover:bg-slate-700/30 hover:shadow-xl"
                }`}
              >
                {selectedFile ? "Change File" : "Select Excel File"}
              </Button>
            </div>
          </div>

          {/* Date Selection Section */}
          <div className="space-y-6 sm:space-y-8 lg:space-y-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-slate-600 to-gray-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-slate-200" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-200">
                  Select Start Date
                </h2>
                <p className="text-slate-400 text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                  Choose the first day of your prayer timetable
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-slate-700/20 to-gray-700/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-600/30 backdrop-blur-sm">
              <SimpleDatePicker
                date={startDate}
                setDate={setStartDate}
                placeholder="Select start date"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-200 mb-1 sm:mb-2">
                Ready to Convert?
              </h3>
              <p className="text-slate-400 text-sm sm:text-base">
                Generate your professional JSON timetable
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <Button
                onClick={generateJSON}
                disabled={!selectedFile || !startDate || isProcessing}
                className={`flex-1 h-16 sm:h-20 text-lg sm:text-xl lg:text-2xl font-bold transition-all duration-300 ${
                  isProcessing
                    ? "bg-slate-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-slate-700 via-gray-700 to-slate-800 hover:from-slate-600 hover:via-gray-600 hover:to-slate-700 hover:shadow-2xl"
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 sm:border-3 border-slate-200 border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Zap className="w-6 h-6 sm:w-8 sm:h-8" />
                    <span>Generate JSON</span>
                  </div>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleClearAll}
                disabled={isProcessing}
                className="h-16 sm:h-20 px-6 sm:px-10 bg-slate-700/20 border-slate-500 text-slate-200 hover:bg-slate-700/30 hover:shadow-xl transition-all duration-300 text-base sm:text-lg font-semibold"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* JSON Output Section */}
          {jsonOutput && (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in-up">
              <div className="flex flex-col gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-slate-600 to-gray-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-slate-200" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-200">
                      Generated JSON
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base mt-1 sm:mt-2">
                      Your prayer timetable is ready
                    </p>
                  </div>
                </div>

                {/* Action Buttons - Always in one line */}
                <div className="flex flex-row gap-2 sm:gap-3 lg:gap-4">
                  <Button
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    className={`flex-1 h-10 sm:h-12 px-3 sm:px-4 lg:px-6 flex items-center justify-center gap-2 transition-all duration-300 text-xs sm:text-sm lg:text-base font-semibold ${
                      copied
                        ? "bg-slate-600/20 border-slate-400 text-slate-300"
                        : "bg-slate-700/20 border-slate-500 text-slate-200 hover:bg-slate-700/30"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Copied!</span>
                        <span className="xs:hidden">✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Copy JSON</span>
                        <span className="xs:hidden">Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* JSON Content - Fully Responsive */}
              <div className="json-output bg-slate-900/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 overflow-auto shadow-2xl border border-slate-700/50 relative max-h-[55vh] sm:max-h-[60vh] lg:max-h-[70vh]">
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <pre className="text-slate-300 text-xs sm:text-sm lg:text-base whitespace-pre font-mono leading-relaxed pt-3 sm:pt-4 min-w-full">
                  {jsonOutput}
                </pre>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gradient-to-r from-slate-700/20 to-gray-700/20 border border-slate-600/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 xl:p-12 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8 sm:mb-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-slate-600 to-gray-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-slate-200" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-300">
                  How to Use
                </h3>
                <p className="text-slate-400 text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                  Follow these steps to convert your timetable
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-4 sm:space-y-6">
                {[
                  "Upload an Excel file (.xlsx or .xls) containing your prayer timetable",
                  "The first row should contain headers (will be automatically ignored)",
                  "Select the start date for your timetable (first day of prayers)",
                  'Click "Generate JSON" to process your data',
                ].map((instruction, index) => (
                  <div key={index} className="flex items-start gap-4 sm:gap-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-600/40 rounded-full flex items-center justify-center mt-1 animate-pulse border border-slate-500/30 flex-shrink-0">
                      <span className="text-slate-200 text-sm sm:text-lg font-bold">
                        {index + 1}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed">
                      {instruction}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-4 sm:space-y-6">
                {[
                  "Each row will automatically be assigned to consecutive dates",
                  "Times can be in 12-hour (1:00 PM) or 24-hour (13:00) format",
                  "The tool will automatically convert all times to 24-hour format",
                  "Download or copy the JSON for use in your masjid display system",
                ].map((instruction, index) => (
                  <div key={index} className="flex items-start gap-4 sm:gap-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-600/40 rounded-full flex items-center justify-center mt-1 animate-pulse border border-slate-500/30 flex-shrink-0">
                      <span className="text-slate-200 text-sm sm:text-lg font-bold">
                        {index + 5}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed">
                      {instruction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Prayer Times Visualization */}
          <div className="bg-gradient-to-r from-slate-700/20 to-gray-700/20 border border-slate-600/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 xl:p-12 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8 sm:mb-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-slate-600 to-gray-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg relative">
                <Clock className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-slate-200" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-gray-500/10 rounded-xl sm:rounded-2xl animate-ping"></div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-300">
                  Prayer Times Structure
                </h3>
                <p className="text-slate-400 text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                  Your JSON will include all five daily prayers
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              {[
                {
                  name: "Fajr",
                  icon: Sun,
                  color: "from-slate-600 to-gray-600",
                  time: "Dawn",
                  description: "Morning prayer before sunrise",
                },
                {
                  name: "Dhuhr",
                  icon: Sun,
                  color: "from-slate-700 to-gray-700",
                  time: "Midday",
                  description: "Noon prayer after sun passes zenith",
                },
                {
                  name: "Asr",
                  icon: Sun,
                  color: "from-gray-700 to-slate-700",
                  time: "Afternoon",
                  description: "Afternoon prayer before sunset",
                },
                {
                  name: "Maghrib",
                  icon: Moon,
                  color: "from-slate-800 to-gray-800",
                  time: "Sunset",
                  description: "Evening prayer after sunset",
                },
                {
                  name: "Isha",
                  icon: Moon,
                  color: "from-gray-800 to-slate-800",
                  time: "Night",
                  description: "Night prayer after twilight",
                },
              ].map((prayer, index) => (
                <div
                  key={index}
                  className="text-center group transition-all duration-300"
                >
                  <div
                    className={`w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-gradient-to-r ${prayer.color} rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:shadow-2xl transition-all duration-300 relative`}
                  >
                    <prayer.icon className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-slate-200" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-gray-500/10 rounded-2xl sm:rounded-3xl animate-ping"></div>
                  </div>
                  <h4 className="text-slate-300 font-bold text-sm sm:text-base lg:text-lg mb-1">
                    {prayer.name}
                  </h4>
                  <p className="text-slate-400 text-xs sm:text-sm mb-1">
                    {prayer.time}
                  </p>
                  <p className="text-slate-500 text-xs leading-tight">
                    {prayer.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out 0.2s both;
        }
        
        .animate-slide-in-up {
          animation: slide-in-up 0.8s ease-out 0.4s both;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default TimetableConverter;
