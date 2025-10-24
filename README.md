# Masjid Timetable Converter

A professional web application that converts Excel prayer timetables to JSON format for digital mosque displays.

## Features

- **Excel File Upload**: Drag and drop or browse to upload .xlsx files
- **Date Selection**: Choose the start date for your timetable
- **Automatic Date Progression**: Each row automatically maps to consecutive dates
- **Time Format Conversion**: Supports both 12-hour (1:00 PM) and 24-hour (13:00) formats
- **Professional UI**: Clean, modern interface designed for mosque staff
- **Copy to Clipboard**: Easy copying of generated JSON

## How to Use

1. **Upload Excel File**: 
   - Drag and drop your Excel file or click "Select Excel File"
   - Only .xlsx files are supported
   - The first row (headers) will be automatically ignored

2. **Select Start Date**: 
   - Choose the first date of your timetable using the date picker
   - Each subsequent row will be assigned to the next day

3. **Generate JSON**: 
   - Click "Generate JSON" to process your file
   - The JSON will appear in the output area below

4. **Copy Result**: 
   - Use the "Copy JSON" button to copy the result to your clipboard
   - The JSON format matches the expected structure for mosque display systems

## Excel File Format

Your Excel file should have the following column structure (starting from row 2, as row 1 is ignored):

| Column | Prayer | Time Type |
|--------|--------|-----------|
| A | Fajr | Start Time |
| B | Fajr | Jamat Time |
| C | Sunrise | Start Time |
| D | Dhuhr | Start Time |
| E | Dhuhr | Jamat Time |
| F | Asr | Start Time |
| G | Asr | Jamat Time |
| H | Maghrib | Start Time |
| I | Isha | Start Time |
| J | Isha | Jamat Time |

## Time Format Support

The application automatically detects and converts time formats:

- **12-hour format**: `1:00 PM`, `12:30 AM`, `11:45 PM`
- **24-hour format**: `13:00`, `00:30`, `23:45`

All output times are converted to 24-hour format for consistency.

## Output Format

The generated JSON follows this structure:

```json
{
  "2025-01-01": {
    "fajr": {
      "start": "05:30",
      "jamat": "06:00"
    },
    "sunrise": {
      "start": "06:45"
    },
    "dhuhr": {
      "start": "12:15",
      "jamat": "12:30"
    },
    "asr": {
      "start": "15:30",
      "jamat": "16:00"
    },
    "maghrib": {
      "start": "18:00"
    },
    "isha": {
      "start": "19:30",
      "jamat": "20:00"
    }
  }
}
```

## Installation & Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open your browser to the provided local URL

## Technologies Used

- React 19
- Vite
- TailwindCSS
- Shadcn UI Components
- XLSX library for Excel processing
- Lucide React for icons

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

- **File upload issues**: Ensure your file is a valid .xlsx format
- **Date selection**: Make sure to select a valid start date
- **Time format errors**: Check that your Excel times are in recognizable formats
- **Empty output**: Verify that your Excel file has data starting from row 2

## Support

This tool is designed to be user-friendly for mosque staff and management. If you encounter any issues, please check the troubleshooting section above or contact your technical support.