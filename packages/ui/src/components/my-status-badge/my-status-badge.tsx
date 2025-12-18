import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'my-status-badge',
  styleUrl: 'my-status-badge.css',
  shadow: true,
})
export class MyStatusBadge {
  @Prop() type: string = 'neutral';

  render() {
    return (
      <span class={`badge ${this.type}`}>
        <slot></slot>
      </span>
    );
  }
}
