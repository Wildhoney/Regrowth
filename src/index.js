const mappings = new WeakMap();

const findElements = (selector, source = document) => Array.from(source.querySelectorAll(selector));

const insertMapping = ({ element, node, cssRule }) => {
    !mappings.has(element) &&
        mappings.set(element, {
            rules: new Set(),
            indices: new Set(),
            sheet: node.sheet
        });
    const map = mappings.get(element);
    map.rules.add({
        node,
        cssRule
    });
    return element;
};

const findElementsFromTree = (tree, source = document) =>
    tree.flatMap(node =>
        Array.from(node.cssRules).flatMap(cssRule =>
            findElements(cssRule.selectorText, source).flatMap(element => insertMapping({ element, node, cssRule }))
        )
    );

const isDocumentReady = () =>
    new Promise(
        resolve =>
            ['interactive', 'complete'].includes(document.readyState)
                ? resolve()
                : document.addEventListener('DOMContentLoaded', resolve)
    );

const createFrame = () => {
    const frame = document.createElement('iframe');
    frame.classList.add('regrowth');
    frame.style.position = 'absolute';
    frame.style.pointerEvents = 'none';
    frame.style.top = 0;
    frame.style.left = 0;
    frame.style.height = '100%';
    frame.style.width = '100%';
    frame.style.border = 0;
    frame.style.opacity = 0;
    return frame;
};

const clearStyles = map => {
    map.indices.forEach(rule => {
        const index = Array.from(map.sheet.cssRules).findIndex(cssRule => cssRule === rule);
        const isValidIndex = index !== -1;
        isValidIndex && map.sheet.deleteRule(index);
    });
    map.indices.clear();
};

const handleResize = (element, frame) => {
    const map = mappings.get(element);
    clearStyles(map);

    Array.from(map.rules).forEach(({ node, cssRule }) => {
        if (frame.contentWindow.matchMedia(node.mediaQuery).matches) {
            const index = node.sheet.insertRule(cssRule.cssText, node.sheet.cssRules.length);
            map.indices.add(node.sheet.cssRules[index]);
        }
    });
};

const setupElement = element => {
    const frame = element.querySelector('iframe.regrowth');

    if (frame) {
        return frame;
    }

    const newFrame = createFrame();
    const isElementStatic = !element.style.position || element.style.position === 'static';

    if (isElementStatic) {
        element.style.position = 'relative';
    }

    element.appendChild(newFrame);
    newFrame.contentWindow.addEventListener('resize', () => handleResize(element, newFrame));
    return newFrame;
};

const isRelevantCSSMediaRule = rule =>
    rule instanceof CSSMediaRule && rule.conditionText.startsWith('container');

const stripContainerPrefix = condition => condition.replace(/^container\s*and/i, '').trim();

const parseStylesheet = link => {
    const rules = Array.from(link.sheet.cssRules);
    const mediaRules = rules.filter(isRelevantCSSMediaRule);
    return mediaRules.map(({ conditionText, cssRules }) => ({
        sheet: link.sheet,
        mediaQuery: stripContainerPrefix(conditionText),
        cssRules
    }));
};

const main = async () => {
    await isDocumentReady();

    const links = findElements('link[rel="stylesheet"]');
    const tree = links.flatMap(parseStylesheet);

    return findElementsFromTree(tree).map(element => {
        const frame = setupElement(element);
        setTimeout(() => handleResize(element, frame), 1);
        return { element, frame };
    });
};

main();
