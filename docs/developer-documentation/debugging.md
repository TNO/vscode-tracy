# Debugging tools & practices

## React Profiler
You can use the React [`Profiler`](https://react.dev/reference/react/Profiler) to mesure the performance of a React tree programmatically. Follow these steps, to do so:

1. Import the `Profiler`
    ```TS
    import { Profiler } from 'react';
    ```
2. Wrap a component in the `Profiler`
    ```TS
    <Profiler id="ExampleComponent" onRender={onRender}>
    <ExampleComponent />
    </Profiler>
    ```
3. Add the following callback to your code (in the file in which the component is rendered.)
    ```TS
    function onRender(id:string, phase: string, actualDuration: number, baseDuration: number, startTime: number, endTime: number) {
        console.log(`Profiling ${id} \n phase: ${phase},\n actualDuration: ${actualDuration},\n baseDuration: ${baseDuration}`);
    }
    ```

## Developer Tools
There are several ways to access the developer tools in Visual Studio code:

1) Click on **Help** at the top of the window and select _Toggle Developer Tools_
2) Press **Ctrl** + **Shift** + **P** to open the Command Pallete. Begin writing and select _Developer: Open Webview Developer Tools_.


## Performance Logging
To determine how much time has elapsed since a particular point in your code, you can do something like this:

```JS
const perfStart = performance.now();
doSomething();
const perfEnd = performance.now();
console.log(`Call to doSomething took ${perfEnd - perfStart} milliseconds.`)
```