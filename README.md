# SmartRent Digital Twin

I want to build a digital twin platform for a company called SmartRent. See the concept here https://github.com/asu-nextlab/smartrent-test

The platform will let you geolocate an apartment complex design on an Open Street Map. The apartments will be designed in Blender or SketchUp with each apartment floorplan defined as a separate object within the overall site design. The site can contain features like trees, roads, paths and other site equipment. However each apartment that we want to feature will be defined as a separate object, that contains furniture and devices (all of which can be selected from the web interface)

The platform will ingest the blender/sketchup file and list the apartment numbers in a spreadsheet where additional data can be edited (for example , number of rooms, baths, floor size) If the apartment object has an embedded device (television, fridge, thermostat) then that item can be selected and viewed as well.

The UI in the attached gituhb is close to what i want. However we need to add more  buildings, models and apartment layouts

if you cant see the github - you can see it working here - http://nextlab.asu.edu/explore/apartment-explorer/

or download the code from here

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rent-scene-explorer.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e4527d59-04ce-4ab2-b9a6-4647d1c6a501).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
