for m in */dist; do
  modname=$(dirname "$m")
  mkdir -p dist/"$modname"
  mv "$m"/* dist/"$modname"/
done

