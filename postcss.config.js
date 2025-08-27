// v4: use @tailwindcss/postcss as the PostCSS plugin
import tailwind from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

export default {
  plugins: [tailwind(), autoprefixer()],
};
