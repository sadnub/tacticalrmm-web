import { defineRouter } from "#q-app/wrappers";
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";

import { useAuthStore } from "src/stores/auth";
import routes from "./routes";

// useful for importing router outside of vue components
// import {router} from "src/router"
export const router = createRouter({
  routes,
  history: createWebHistory(process.env.VUE_ROUTER_BASE),
});

export default defineRouter(function ({ store }) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === "history"
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach((to, from, next) => {
    const auth = useAuthStore(store);

    if (to.meta.requireAuth) {
      if (!auth.loggedIn) {
        auth.next = to.fullPath;
        next({
          name: "Login",
        });
      } else {
        next();
      }
    } else if (to.meta.requiresVisitor) {
      if (auth.loggedIn) {
        next({
          name: "Dashboard",
        });
      } else {
        next();
      }
    } else {
      next();
    }
  });

  return Router;
});
