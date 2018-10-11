const styleMappings = new WeakMap();

const styleRegistry = new WeakMap();

function findElements(selector, source = window.document) {
    return Array.from(source.querySelectorAll(selector));
}

function findMatchingElements(tree, source = window.document) {
    return tree.flatMap(node => {
        return Array.from(node.cssRules).flatMap(cssRule => {
            return findElements(cssRule.selectorText, source).flatMap(element => {
                !styleMappings.has(element) &&
                    styleMappings.set(element, {
                        rules: new Set(),
                        indices: new Set(),
                        sheet: node.sheet
                    });
                const styleMapping = styleMappings.get(element);
                styleMapping.rules.add({
                    node,
                    cssRule
                });
                return element;
            });
        });
    });
}

function createIFrame(iframe) {
    iframe.classList.add('regrowth');
    iframe.style.position = 'absolute';
    iframe.style.pointerEvents = 'none';
    iframe.style.top = 0;
    iframe.style.left = 0;
    iframe.style.height = '100%';
    iframe.style.width = '100%';
    iframe.style.border = 0;
    iframe.style.opacity = 0;
    return iframe;
}

function handleResize(element, iFrame) {
    const map = styleMappings.get(element);

    map.indices.forEach(rule => {
        const index = Array.from(map.sheet.cssRules).findIndex(cssRule => cssRule === rule);
        index !== -1 && map.sheet.deleteRule(index);
    });

    map.indices.clear();

    Array.from(map.rules).forEach(({ node, cssRule }) => {
        if (!iFrame.contentWindow.matchMedia(node.mediaQuery).matches) {
            return null;
        }

        const index = node.sheet.insertRule(cssRule.cssText, node.sheet.cssRules.length);
        map.indices.add(node.sheet.cssRules[index]);
    });
}

function initialiseContext(element) {
    const iFrame = element.querySelector('iframe.regrowth');

    if (iFrame) {
        return iFrame;
    }

    const newIFrame = createIFrame(document.createElement('iframe'));
    const isElementStatic = !element.style.position || element.style.position === 'static';

    if (isElementStatic) {
        element.style.position = 'relative';
    }

    element.appendChild(newIFrame);
    newIFrame.contentWindow.addEventListener('resize', () => handleResize(element, newIFrame));
    return newIFrame;
}

function parseStyleAST(link) {
    const rules = Array.from(link.sheet.cssRules);
    const mediaRules = rules.filter(
        rule => rule instanceof window.CSSMediaRule && rule.conditionText.startsWith('container')
    );
    return mediaRules.map(({ conditionText, cssRules }) => ({
        sheet: link.sheet,
        mediaQuery: conditionText.replace(/^container\s*and/i, '').trim(),
        cssRules
    }));
}

function main() {
    const tags = findElements('link[rel="stylesheet"]');
    const tree = tags.flatMap(parseStyleAST);
    const elements = findMatchingElements(tree);
    elements.forEach(element => {
        const iFrame = initialiseContext(element);
        setTimeout(() => handleResize(element, iFrame), 1);
    });
}

main();
