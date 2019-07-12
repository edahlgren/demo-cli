# Find the shortest roundtrip through Qatar (194 cities)
# using an artificial ant colony and the MAX-MIN method
#
# Input:
#
#   -i qa194.tsp        A graph representing all 194 cities
#                       in the country of Qatar
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
#   best.qa194          Statistics about the best (shortest)
#                       solution for each trial
#   cmp.qa194           Statistics about all trial runs
#   stat.qa194          Raw statistics
#   
#   Learn more: run 'demo help output'

/root/bin/acotsp \
    -i /root/data/cities/qatar/qa194.tsp \
    --mmas \
    --tries 1 \
    --time 5
