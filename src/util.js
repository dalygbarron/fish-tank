/**
 * Asynchronously loads a text file in.
 * @param url is the url to load the file from.
 * @return a promise that resolves to the loaded file.
 */
async function loadText(url) {
    return await new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) resolve(this.responseText);
                else reject(
                    `couldn't get file '${url}', response code ${this.status}`
                );
            }
        };
        xhr.open("GET", url, true);
        xhr.send();
    });
}
