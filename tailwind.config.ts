const config = {
  content: ['./client/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#00DC82',
        primary: '#099e61',
        context: 'rgba(var(--nui-c-context), <alpha-value>)',
      },
    },
  },
  plugins: [],
}

export default config
