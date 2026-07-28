const regex = /\{\s*([a-zA-Z_$][a-zA-Z0-9_$.]*)\s*\}/g;
console.log("body { color: red; }".replace(regex, "X"));
console.log("Hello {name}!".replace(regex, "X"));
console.log("User { user.name }".replace(regex, "X"));
console.log("Invalid { 123 }".replace(regex, "X"));
