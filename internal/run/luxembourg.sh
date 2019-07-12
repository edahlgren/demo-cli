# Find the shortest roundtrip through Luxembourg (980 cities)
# using an artificial ant colony and the MAX-MIN method
#
# Input:
#
#   -i lu980.tsp        A graph representing all 38 cities
#                       in the country of Luxembourg
#
#   Learn more: run 'demo help input'
#
# Parameters:
#
#   --mmas              Use the MAX-MIN method
#   --tries 1           Run 1 trial
#   --time 5            Each trial lasts 5 seconds
#
#   Learn more: run 'demo help params'
#
# Output:
#
#   best.lu980          Statistics about the best (shortest)
#                       solution for each trial
#   cmp.lu980           Statistics about all trial runs
#   stat.lu980          Raw statistics
#   
#   Learn more: run 'demo help output'

/root/bin/acotsp \
    -i /root/data/cities/luxembourg/dj38.tsp \
    --mmas \
    --tries 1 \
    --time 5
