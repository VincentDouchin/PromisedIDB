const PromisedIDB = async (dbName, stores) => {
    const getDB = async (version = undefined) => await new Promise((resolve, reject) => {
        const openReq = window.indexedDB.open(dbName, version)
        openReq.onsuccess = async e => {
            const db = e.target.result
            if (Object.keys(stores).some(storeName => !db.objectStoreNames.contains(storeName))) {
                db.close()
                resolve(await getDB(db.version + 1))
            } else {
                resolve(db)
            }
        }
        openReq.onupgradeneeded = async e => {
            const db = e.target.result

            const storesToCreate = Object.entries(stores).filter(([storeName, key]) => !db.objectStoreNames.contains(storeName))

            const createStore = (storeName, key) => new Promise((resolve, reject) => {
                const store = db.createObjectStore(storeName, { keyPath: key })
                const transaction = store.transaction
                transaction.onsuccess = e => {
                    resolve(e)
                }
                transaction.onerror = e => {
                    console.error(e)
                    reject(e)
                }
            })
            for (let [storeName, key] of storesToCreate) {
                await createStore(storeName, key)
            }
            db.close()
            resolve(await getDB())
        }
        openReq.onerror = e => {
            console.error(e)
            reject(e)
        }
    })
    let db = await getDB()
    db.onversionchange = async () => {
        db.close()
        db = await getDB()
    }
    const proxy = new Proxy(db, {
        get(target, prop,) {
            if (prop == 'then') return target
            if (prop in db) return db[prop]
            return async (storeName, newItem) => await new Promise((resolve, reject) => {
                const store = db.transaction([storeName], 'readwrite').objectStore(storeName)
                const result = store[prop](newItem)
                result.onsuccess = e => {
                    resolve(e.target.result)
                }
                result.onerror = e => {
                    console.error(e)
                    reject(e)
                }
            })
        },
    })
    return proxy
}
export default PromisedIDB