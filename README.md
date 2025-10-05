# webdev-project-work

## Resources used
### Icons
https://fontawesome.com/
https://iconify.design/

### styling
#### toggle styling
https://flowbite.com/docs/forms/toggle/


### tilelayers
https://leaflet-extras.github.io/leaflet-providers/preview/

### geoJson
https://mapscaping.com/geojson-every-country-in-the-world/

## dataset
https://www.gbif.org/dataset/50c9509d-22c7-4a22-a47d-8c48425ef4a7
https://www.inaturalist.org/observations/export
https://api.inaturalist.org/v1/docs/#/
https://laji.fi/en/taxon/list?finnish=true&taxonRank=MX.species&informalTaxonGroups=MVL.40

### Guides
https://flowbite.com/docs/forms/radio/
https://gis.stackexchange.com/questions/385444/openstreetmap-baselayer-of-just-one-country
https://gis.stackexchange.com/questions/179630/setting-bounds-and-making-map-bounce-back-if-moved-away

https://www.inaturalist.org/observations?place_id=7020&quality_grade=research&subview=map&iconic_taxa=Aves,Amphibia,Reptilia,Mammalia,Actinopterygii,Mollusca,Arachnida,Insecta

https://daily-dev-tips.com/posts/vanilla-javascript-replace-all-whitespaces/

## tools
https://onlinetsvtools.com/convert-tsv-to-json

## AI usage:
Debugging display: none issue:
https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221_fmdbZeVvfUuEgAG1bVOmI3pipvbizpe%22%5D,%22action%22:%22open%22,%22userId%22:%22113669772119444372108%22,%22resourceKeys%22:%7B%7D%7D&usp=sharing


## Changelog and insights

I had the scientific names toggle set in such a way that the text content on each dropdown item would change. While developing I thought to myself: Actually, wouldn't it make more sense to just have both values rendered inside the option? That way we don't have to trigger a re-render of the text content by toggling. We can just toggle what is displayed. 
An issue with that is the fact that the option tag can not have html elements inside of it. So I would have to re-create the dropdown by myself. 
