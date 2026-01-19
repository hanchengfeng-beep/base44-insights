import Home from './pages/Home';
import MultiTableQueries from './pages/MultiTableQueries';
import CronLogsViewer from './pages/CronLogsViewer';
import WebSocketTest from './pages/WebSocketTest';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "MultiTableQueries": MultiTableQueries,
    "CronLogsViewer": CronLogsViewer,
    "WebSocketTest": WebSocketTest,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};