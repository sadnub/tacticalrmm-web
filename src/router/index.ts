import { defineRouter } from "#q-app/wrappers";
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";

import { useAuthStore } from "src/core/dashboard/api";
import routes from "./routes";

// useful for importing router outside of vue components
// import {router} from "src/router"
export const router = createRouter({
  routes,
  history: createWebHistory(process.env.VUE_ROUTER_BASE),
});

export default defineRouter(function () {
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
    const { loggedIn, next: authNext } = useAuthStore();

    if (to.meta.requireAuth) {
      if (!loggedIn.value) {
        authNext.value = to.fullPath;
        next({
          name: "Login",
        });
      } else {
        next();
      }
    } else if (to.meta.requiresVisitor) {
      if (loggedIn.value) {
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
