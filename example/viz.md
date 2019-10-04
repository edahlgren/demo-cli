# Visualizing ant colony search

## Mapping the cities

The cities are numbered and have x-y coordinates under NODE_COORD_SECTION. Those x-y coordinates can be used to compute the euclidean distance between the cities. That's useful to us in order to present a scale. But we can plot the nodes and label them and scale them proportionally to the canvas or viewport. We also probably want to scale a background image showing the country boundaries and landmarks. I'm not sure where that background image will come from --- we might need to create our own to have control over the scale and shape and exact location of the cities.

## Position of ants

Ants are moved from city to city, where cities are represented
as numbers 0 .. n-1 (construct_solutions).

## Iteration

Initially, each ant is placed at the same randomly selected city (place_ant).

Then one step is taken for each city, and each ant is moved to another
location (neighbor_choose_and_move_to_next).

Then at the last step the tour length is calculated (a->tour_length),
and the global tour count is incremented to be the same as the number
of ants --- which is used to stop if max_tours is given.

Then the shortest tour is selected and compared to the best tour from a previous
iteration. If it's the new best, it's saved in the best_so_far_ant structure,
(containing ant->tour with the cities traversed at each step).

Finally the pheromone values of the trail are increased and decreased
depending on the algorithm. The next iteration uses this information
and the ant colony moves to new cities differently than before.

### Try

A try is an independent execution of the algorithm, where all ants and
structures are zeroed. It's a way to automatically run the simulation
many times, even though you can do this easily with a script as well.
It's not very meaningful, as we run it once in the demos.

## Hooks - Ants and tours

Before the while-loop in construct_solutions(), the array of ants (ant)
contains the initial position of all of the ants.

Inside the while-loop, at the end of the block, each ant has been moved
forward, where ant[k][step] contains its location.

After the while-loop, the tours are complete. The best (shortest) one
can easily be selected and highlighted, and the others can fade into the
background as needed.

Before each iteration starts the previous tour is thrown away (ant_empty_memory),
so you need to record it if you want to preserve the history.

## Hooks - Pheromones

In pheromone_trail_update(), first the pheromones are evaporated (weakened) and then they're strengthened based on the last best solution, according to the different strategies of the algorithms. Regardless, the pheromone[i][j] matrix is updated. It contains a weight for the path between every two cities representing the pheromones.

## Layers

BACKGROUND

The country outline and major features (water, international boundaries, minimal labels) need to available as the base layer, which can be shown or hidden behind the rest of the visualization to give more context to the cities. See CITIES for the coordinates that need to be positioned, which should inform the scale, detail level, and border of the contextual background.
 
CITIES

First, the cities need to be plotted to give the ants and trails context. That can be done using just the input TSP file containing the node coordinates, and open map data for the region of interest. Apparently the x-y coordinates values are decimal degrees (11583.333300 43150.000000 -> 11.583333300,43.150) which can be used by Google Maps and other GIS tools.

ANTS

Second, the ant locations can be plotted for any iteration using the data from construct_solutions(). To keep things simple, we could plot ants at a given iteration on demand.

TOURS / PATHS

For a given iteration, we could layer on all tours, just the best one, or none at all. The data comes from the same place as the ant locations (a->tour) in construct_solutions().

PHEROMONES

Finally, the pheromone values for paths between cities can fade in and out as evaporation and pheromone strengthening take place. The previous pheromone values should be shown before the iteration begins, and then after the ants move, the pheromones should show evaportaion and strengthening stages, which carry over to the next iteration.

---

Extra for later: alpha, rho, and heuristic information, showing labels with the current values and how they affect the ants behavior.

---

MVP:

0. Print the data to a CSV file at each iteration
1. Create a background layer with country boundaries shown, and plot the cities
2. Position the ants at each iteration, creating a new SVG for each
3. Add the tours and pheromones at each iteration as optional layers
4. Allow browsing through the time series of iterations
5. Add numeric annotations and a distance scale
6. Allow enabling and disabling layers

ADVANCED:

4. Add animation of pheromone evaporation and ant movement
5. Pull out the new best solution as its found and display it on the side
6. Allow taking snapshots of the visualization and creating a story about it
