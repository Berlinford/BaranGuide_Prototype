/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
  "./src/**/*.{js,jsx,ts,tsx}",
  "./assets/components/**/*.{js,jsx,ts,tsx}",
 ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        REM: ["rem_regular"],
        REM_BOLD: ["rem_bold"],
        REM_LIGHT: ["rem_light"]
      }
    },
  },
  plugins: [],
}