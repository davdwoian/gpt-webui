import fs from 'fs'
import path from 'path'
import stringify from 'json-stable-stringify'

const dataPath = '../../public/data.json'

let data: { [key: string]: any } = {}

export const read = (id: string, prop: string): any => {
    if (!(id in data) || !(prop in data[id])) {
        console.log('miss')
        return undefined
    }
    return data[id][prop]
}

export const write = (id: string, json: object) => {
    if (!(id in data)) {
        data[id] = {}
    }
    Object.assign(data[id], json)
}

export const push = () => {
    fs.writeFileSync(
        path.resolve(__dirname, dataPath),
        stringify(data, { space: '    ' })
    )
}

export const pull = async () => {
    try {
        const json = await fs.promises.readFile(
            path.resolve(__dirname, dataPath),
            'utf8'
        )
        data = JSON.parse(json)
    } catch (err) {
        console.error('Failed to load data from file', err)
        data = {}
    }
}
