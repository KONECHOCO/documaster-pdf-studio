// Application Entrypoint - Orchestrates Components, State & Modals
import './styles/theme.css';
import './styles/app.css';

import { renderHeader } from './components/Header.js';
import { renderToolGrid } from './components/ToolGrid.js';
import { openScannerModal } from './components/ScannerModal.js';
import { openAnalyticsModal } from './components/AnalyticsModal.js';
import { openEditorModal } from './components/EditorModal.js';
import { openSignatureModal } from './components/SignatureModal.js';
import { openOrganizeModal } from './components/OrganizeModal.js';
import { openGenericToolModal } from './components/GenericToolModal.js';
import { openFillFormModal } from './components/FillFormModal.js';

// Setup DOM Root Structure
const app = document.getElementById('app');
app.innerHTML = `
  <header id="app-header"></header>
  <main id="app-main"></main>
`;

const headerContainer = document.getElementById('app-header');
const mainContainer = document.getElementById('app-main');

// Initialize saved theme
const savedTheme = localStorage.getItem('documaster_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

function handleThemeToggle() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('documaster_theme', newTheme);
  renderAll();
}

function handleLanguageChange() {
  renderAll();
}

function handleSelectTool(toolId, initialFile = null) {
  if (toolId === 'scanner') {
    openScannerModal();
  } else if (toolId === 'analytics') {
    openAnalyticsModal(initialFile, null, (action, file) => {
      handleSelectTool(action, file);
    });
  } else if (toolId === 'edit') {
    openEditorModal(initialFile);
  } else if (toolId === 'sign') {
    openSignatureModal(initialFile);
  } else if (toolId === 'fillForm') {
    openFillFormModal(initialFile);
  } else if (toolId === 'organize') {
    openOrganizeModal(initialFile);
  } else {
    openGenericToolModal(toolId, initialFile);
  }
}

function renderAll() {
  renderHeader(headerContainer, handleLanguageChange, handleThemeToggle);
  renderToolGrid(mainContainer, handleSelectTool);
}

// Initial Render
renderAll();

// Global Drag & Drop on whole window to auto-inspect or process PDF
window.addEventListener('dragover', (e) => {
  e.preventDefault();
});

window.addEventListener('drop', (e) => {
  e.preventDefault();
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.type === 'application/pdf') {
      openAnalyticsModal(file, null, (action, f) => {
        handleSelectTool(action, f);
      });
    }
  }
});
