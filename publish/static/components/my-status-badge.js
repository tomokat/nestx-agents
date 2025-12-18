import { t as transformTag, p as proxyCustomElement, H, h } from './p-DqDrDklP.js';

const myStatusBadgeCss = () => `.badge{padding:4px 8px;border-radius:4px;font-weight:bold;text-transform:uppercase;font-size:0.8rem;font-family:sans-serif}.success{background-color:#d4edda;color:#155724}.error{background-color:#f8d7da;color:#721c24}.neutral{background-color:#e2e3e5;color:#383d41}`;

const MyStatusBadge$1 = /*@__PURE__*/ proxyCustomElement(class MyStatusBadge extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    type = 'neutral';
    render() {
        return (h("span", { key: 'ad28e483b78b2bba96a33d2077cc0254c25cd1c9', class: `badge ${this.type}` }, h("slot", { key: '4e0cb3a2d5fa5af12c124201853458d5263d2fe5' })));
    }
    static get style() { return myStatusBadgeCss(); }
}, [769, "my-status-badge", {
        "type": [1]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["my-status-badge"];
    components.forEach(tagName => { switch (tagName) {
        case "my-status-badge":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), MyStatusBadge$1);
            }
            break;
    } });
}
defineCustomElement$1();

const MyStatusBadge = MyStatusBadge$1;
const defineCustomElement = defineCustomElement$1;

export { MyStatusBadge, defineCustomElement };
//# sourceMappingURL=my-status-badge.js.map

//# sourceMappingURL=my-status-badge.js.map