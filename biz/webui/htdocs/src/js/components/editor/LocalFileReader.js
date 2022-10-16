class LocalFileReader {

    /**
     * @typedef {Object} LocalFileInfo
     * @property {string} name
     * @property {ArrayBuffer} buffer
     */

    /**
     * @returns {Promise<LocalFileInfo>}
     */
    static async read() {
        return new Promise((resolve) => {
            let input = document.createElement('input')
            input.type = 'file'
            input.onchange = (event) => {
                var f = event.target.files[0]
                resolve(this.readFile(f))
            }
            setTimeout(() => {
                input.click()
            }, 100)
        })
    }

    /**
     * @param {File} file 
     * @returns {Promise<LocalFileInfo>}
     */
    static async readFile(file) {
        return new Promise((resolve) => {
            if (!file) {
                resolve()
                return
            }
            var r = new FileReader()
            r.onload = async (event) => {
                let buffer = event.target.result
                resolve({ name: file.name, buffer: buffer })
            }
            r.readAsArrayBuffer(file)
        })
    }

    /**
     * @returns {Promise<Blob>}
     */
    static async readCliboardImage() {
        let list = await navigator.clipboard.read()
        let image = null
        for (const item of list) {
            let imageType = null
            let types = item.types
            for (const type of types) {
                if (type.startsWith("image")) {
                    imageType = type
                }
            }
            if (imageType) {
                image = await item.getType(imageType)
                console.log(image);
            }
        }

        console.log('image', image)

        if (!image) {
            return null
        }

        return image
    }
}

export default LocalFileReader