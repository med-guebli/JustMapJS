# JustMapJS

JustMap is a javascript library that provides functions to map a JSON object to a view.

## Basic syntax

This is a simple example to how to use JustMapJS

### HTML side

First of all, you need to create an HTML model, this model will be filled up and returend by JustMapJS

```
<div id="domModel"> {{ username }} : {{ birthdate }} </div>
```

### Javascript side

* Get the model from the dom
* Call JustMap.map(domModel, jsonObj)
* Add the returned object to your container

```
let data = {
    username: "Med",
    birthdate: "23/06/1990"
};

let domModel = document.getElementById("domModel");
let domModelMapped = JustMap.map(domModel, data);

document.body.append(domModelMapped);
```
### Result will be 
```
Med : 23/06/1990
```
