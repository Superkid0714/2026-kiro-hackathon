/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        indigo: '#5B4FCF',
        indigoHi: '#7A6EF0',
        lavender: '#B7ACEF',
        lavenderSoft: '#EDE9FC',
        pink: '#F3A9D2',
        pinkSoft: '#FBE3F1',
        peach: '#F6C79A',
        peachSoft: '#FDEEDD',
        mint: '#8FDDBF',
        mintSoft: '#E1F6EC',
        cream: '#FBF9FF',
        ink: '#2A2450',
        inkSoft: '#726CA0',
        inkFaint: '#A7A2CC',
        line: '#E8E4FA',
        night1: '#221A4E',
        night2: '#171233',
      },
      fontFamily: {
        noto: ['"Noto Sans KR"', 'sans-serif'],
        gaegu: ['Gaegu', 'cursive'],
      },
      boxShadow: {
        card: '0 10px 30px rgba(74,58,150,0.12)',
        pop: '0 18px 40px rgba(43,30,110,0.28)',
      },
    },
  },
  plugins: [],
};
