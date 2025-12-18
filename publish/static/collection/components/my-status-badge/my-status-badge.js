import { h } from "@stencil/core";
export class MyStatusBadge {
    type = 'neutral';
    render() {
        return (h("span", { key: 'ad28e483b78b2bba96a33d2077cc0254c25cd1c9', class: `badge ${this.type}` }, h("slot", { key: '4e0cb3a2d5fa5af12c124201853458d5263d2fe5' })));
    }
    static get is() { return "my-status-badge"; }
    static get encapsulation() { return "shadow"; }
    static get originalStyleUrls() {
        return {
            "$": ["my-status-badge.css"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["my-status-badge.css"]
        };
    }
    static get properties() {
        return {
            "type": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
                    "references": {}
                },
                "required": false,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": ""
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "type",
                "defaultValue": "'neutral'"
            }
        };
    }
}
//# sourceMappingURL=my-status-badge.js.map
