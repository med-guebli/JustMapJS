# JustMapJS

JustMap is a javascript library that provides a function to map a JSON object to a view.

## Getting Started

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
    birthdate: "23/06/1990",
    photos: ["pic1.jpg", "pic2.jpg", "pic3.jpg", "pic4.jpg"]
};

let domModel = document.getElementById("domModel");
let domModelMapped = JustMap.map(domModel, data);

document.body.append(domModelMapped);
```
#### Result
```
Med : 23/06/1990
```

## String Interpolation

```
{{ attribute_name }}
```

## Attribute binding
Attribute binding is used to bind element's attributes to values

```
<input type="text" name="username" [value]="username" />
```

## If statement
If statement is used to show/hide an HTML element based on a condition 

```
<div [*if]="username == 'Med'">Some content here</div>
```

## For statement
For/loop statement is used iterate over an array

```
<div [*for]="photos:photo">
    <img [src]="photo" />
</div>
```

# Full example
```
<h3> Username : {{ username }}</h3>
<h3> Birthdate : {{ birthdate }}</h3>

<div [*if]="!photos || photos.length == 0" class="alert alert-info">
    No photos were found for this user
</div>

<div [*if]="photos && photos.length > 0">
    <div [*for]="photos:photo">
        <img [src]="photo" />
    </div>
</div>
```
