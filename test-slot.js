import { parseComponent, renderComponent, ComponentRegistry } from './src/zolto.js';
const registry = new ComponentRegistry();
const src1 = `
component Card(title, subtitle="", variant="default")
card variant=variant
### {title}
{subtitle}
slot
end
end

Card(title="Welcome", subtitle="Hello World", variant="primary")
This is the body.
end
`;
const { nodes } = parseComponent(src1, { registry });
const rendered1 = renderComponent(nodes[1], {}, registry);
console.log(rendered1);
