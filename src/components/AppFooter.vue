<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <span>FOHOW Exchange &copy; {{ year }}</span>
      <span class="footer-links">
        <a href="https://marketingfohow.ru" target="_blank" rel="noopener">FOHOW Marketing</a>
      </span>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.app-footer {
  background: white;
  border-top: 1px solid var(--gray-200);
  padding: 16px 20px;
  margin-top: 40px;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--gray-500);
}
.footer-links a {
  color: var(--gray-500);
}
</style>
