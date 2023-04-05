import Vue from "vue";
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
    //   light: {
    //     primary: colors.primary,
    //     error: colors.error,
    //     dark: colors.dark
    //   },
    //   dark: {
    //     primary: colors.primary,
    //     error: colors.error,
    //     dark: colors.dark
    //   }
    }
  }
});