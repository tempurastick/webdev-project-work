function replaceWhitespace(string) {
    return string.replace(/\s/g, "%");
}

// https://stackoverflow.com/questions/70595420/how-to-throttle-my-js-api-fetch-requests-using-the-rate-limit-supplied-by-the-h
function debounce(func, waitFor) {
    let timeout;
    return (...args) =>
        new Promise((resolve) => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => resolve(func(...args)), waitFor);
        });
}

export { replaceWhitespace, debounce };
