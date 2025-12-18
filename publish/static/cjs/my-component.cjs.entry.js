'use strict';

var index = require('./index-Cg2jQwez.js');
var index$1 = require('./index.cjs.js');

const myComponentCss = () => `:host{display:block}`;

const MyComponent = class {
    constructor(hostRef) {
        index.registerInstance(this, hostRef);
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
        return index$1.format(this.first, this.middle, this.last);
    }
    render() {
        return index.h("div", { key: '70654fc83039b5f659efe99cc990e9b86d20dbe0' }, "Hello, World! I'm ", this.getText());
    }
};
MyComponent.style = myComponentCss();

exports.my_component = MyComponent;
//# sourceMappingURL=my-component.entry.cjs.js.map
