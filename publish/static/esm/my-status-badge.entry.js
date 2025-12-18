import { r as registerInstance, h } from './index-Da-d8Ktn.js';

const myStatusBadgeCss = () => `.badge{padding:4px 8px;border-radius:4px;font-weight:bold;text-transform:uppercase;font-size:0.8rem;font-family:sans-serif}.success{background-color:#d4edda;color:#155724}.error{background-color:#f8d7da;color:#721c24}.neutral{background-color:#e2e3e5;color:#383d41}`;

const MyStatusBadge = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
    }
    type = 'neutral';
    render() {
        return (h("span", { key: 'ad28e483b78b2bba96a33d2077cc0254c25cd1c9', class: `badge ${this.type}` }, h("slot", { key: '4e0cb3a2d5fa5af12c124201853458d5263d2fe5' })));
    }
};
MyStatusBadge.style = myStatusBadgeCss();

export { MyStatusBadge as my_status_badge };
//# sourceMappingURL=my-status-badge.entry.js.map
