# PromisedIDB
A small and simple IndexedDB wrapper with async/await syntax

Create a database with objectStores and keys :
```js
const db = await PromisedIDB('databaseName', { store1: 'keyPath1', store2: 'keyPath2' })
```
Acess the stores :
```js
await db.put('store1', { keyName1: 0, data: ['a', 'b', 'c'] })
const responseAll = await db.getAll('store1') // [{keyPath1:0,data:['a','b','c']}]
const responseSpecific = await db.get('store1', 0) // {keyPath1:0,data:['a','b','c']}
```
PromisedIDB will automatically close and update the database if the database already exists and not all the stores are already present.

With PromisedIDB you do not need to manage the different versions of your database manually. 
 ```js
const db = await PromisedIDB('databaseName', { store1: 'keyPath1', store2: 'keyPath2', newStore: 'newStoreKeyPath' })
 // the database will be closed, an upgrade is issued and after the stores are created the databse will be returned
 ```
 Since the scope of this project was to create a small and simple wrapper for IndexedDB in order to cache data, indexes and other paraameters (like auto-increment) are not handled by PromisedDB.
 
 Example :
 ```js
const db = await PromisedIDB('cache', { todos: 'id' })
//Create a function to get the data and cache it on the client
const getTodo = async (id) => {
    const todo = await (await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`)).json()
    db.put('todos', todo)
    return todo
}
const getCachedTodo = async (id) => {
    // initialize the response
    // the response is an object in order to pass the data by reference instead of by value
    const response = { data: undefined }
    // check if the cache contains the todo
    const cachedData = await db.get('todos', id)
    
    if (!cachedData) {
        // if the todo is not present in the cache we wait for the response
        response.data = await getTodo(id)
    } else {
        // if the data is cached we return the cached data immediatly   
        response.data = cachedData
        // and refresh the data after we get the response from the request
        getTodo(id).then(todo => response.data = todo)
    }
    return response
}

const todo = await getCachedTodo(1) // { data: {userId: 1, id: 1, title: 'delectus aut autem', completed: false} }

 }
 ```
