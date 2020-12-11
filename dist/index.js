'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const joi_1 = __importDefault(require("joi"));
const plug_api_methods_1 = __importDefault(require("./plug-api-methods"));
const plug_api_events_1 = __importDefault(require("./plug-api-events"));
class PlugDjApi extends events_1.default {
    constructor(puppeteerOptions = {}) {
        super();
        this.PLUG_URL = 'https://plug.dj';
        this.PLUG_LOGIN_URL = 'https://plug.dj/_/auth/login';
        this.PLUG_ROOM_URL = 'https://plug.dj/{roomId}';
        this.puppeteerOptions = Object.assign(Object.assign({ headless: true }, puppeteerOptions));
        this.mirrorPlugApiMethods();
    }
    /**
     * Logs in to Plug and brings up specified room
     */
    async connect(options) {
        const optionsSchema = {
            password: joi_1.default.string()
                .min(1)
                .required(),
            roomId: joi_1.default.string()
                .min(1)
                .required(),
            username: joi_1.default.string()
                .min(1)
                .required(),
        };
        const validation = joi_1.default.validate(options, optionsSchema);
        if (validation.error) {
            throw new Error(validation.error.details.map(i => i.message).join(''));
        }
        else {
            const browser = await puppeteer_1.default.launch(this.puppeteerOptions);
            this.page = await browser.newPage();
            try {
                await this.login(options.username, options.password);
                await this.visitRoom(options.roomId);
            }
            catch (err) {
                throw new Error('Could not login or visit room, check credentials and/or room name');
            }
        }
    }
    /**
     * Logs in to Plug.dj
     */
    async login(username, password) {
        await this.page.goto(this.PLUG_URL, { waitUntil: 'load' });
        await this.page.evaluate((loginUrl, username, password) => {
            return new Promise((resolve, reject) => {
                const interval = window.setInterval(() => {
                    if (window._csrf) {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', loginUrl, true);
                        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
                        xhr.onload = () => {
                            if (xhr.readyState === xhr.DONE) {
                                if (xhr.status === 200) {
                                    resolve(true);
                                }
                                else {
                                    reject(false);
                                }
                            }
                        };
                        xhr.send(JSON.stringify({
                            csrf: window._csrf,
                            email: username,
                            password,
                        }));
                        clearInterval(interval);
                    }
                }, 500);
            });
        }, this.PLUG_LOGIN_URL, username, password);
    }
    /**
     * Navigate to the Plug.dj room
     */
    async visitRoom(roomId) {
        await this.page.goto(this.PLUG_ROOM_URL.replace('{roomId}', roomId), { waitUntil: 'load' });
        await this.page.exposeFunction('__sendout', (eventType, data) => this.emit(eventType, data));
        await this.page.evaluate((plugApiEventNames) => {
            return new Promise((resolve, reject) => {
                const interval = window.setInterval(() => {
                    if (typeof window.API !== 'undefined' && window.API.getUsers().length) {
                        clearInterval(interval);
                        // Register event handlers
                        for (const [key, value] of plugApiEventNames) {
                            window.API.on(value, data => window.__sendout(key, data));
                        }
                        resolve();
                    }
                }, 500);
            });
        }, plug_api_events_1.default);
    }
    /**
     * Executes a Plug API method in the context of the Plug room
     */
    async runPlugApiMethod(method, args) {
        return await this.page.evaluate((method, args) => window.API[method].apply(this, args), method, args);
    }
    /**
     * Creates methods within this class to mirror the plug API ones
     */
    mirrorPlugApiMethods() {
        for (const method of plug_api_methods_1.default) {
            if (!this.hasOwnProperty(method)) {
                this[method] = (...args) => this.runPlugApiMethod(method, args);
            }
        }
    }
}
/* tslint:disable:no-string-literal */
module.exports = exports['defaults'] = PlugDjApi;
//# sourceMappingURL=index.js.map