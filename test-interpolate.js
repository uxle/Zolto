import { interpolateText } from './src/component/props.js';
console.log(interpolateText("body { color: red; }"));
console.log(interpolateText("let obj = {a: 1, b: 2};"));
console.log(interpolateText("Hello {name}!", { name: "Zolto" }));
console.log(interpolateText("User { user.name }", { user: { name: "Alice" } }));
