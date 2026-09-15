import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './style.css';
import 'leaflet/dist/leaflet.css';

const app = createApp(App);
app.use(createPinia());

// Global error handler — prevent uncaught errors from crashing the app
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Global Error]', err, info);
};

app.mount('#app');
