import { t as transformTag, p as proxyCustomElement, H, h } from './p-DqDrDklP.js';
import { format } from './index.js';

const myComponentCss = () => `:host{display:block}`;

const MyComponent$1 = /*@__PURE__*/ proxyCustomElement(class MyComponent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    /**
     * The first name
     */
    first;
    /**
     * The middle name
     */
    middle;
    /**
     * The last name
     */
    last;
    getText() {
        return format(this.first, this.middle, this.last);
    }
    render() {
        return h("div", { key: '70654fc83039b5f659efe99cc990e9b86d20dbe0' }, "Hello, World! I'm ", this.getText());
    }
    static get style() { return myComponentCss(); }
}, [769, "my-component", {
        "first": [1],
        "middle": [1],
        "last": [1]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["my-component"];
    components.forEach(tagName => { switch (tagName) {
        case "my-component":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), MyComponent$1);
            }
            break;
    } });
}
defineCustomElement$1();

const MyComponent = MyComponent$1;
const defineCustomElement = defineCustomElement$1;

export { MyComponent, defineCustomElement };
//# sourceMappingURL=my-component.js.map

//# sourceMappingURL=my-component.js.map