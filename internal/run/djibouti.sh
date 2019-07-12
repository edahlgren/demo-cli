# Find the shortest roundtrip through Djibouti (38 cities)
# using an artificial ant colony and the MAX-MIN method
#
# Input:
#
#   -i dj38.tsp         A graph representing all 38 cities
#                       in the country of Djibouti
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
#   best.dj38           Statistics about the best (shortest)
#                       solution for each trial
#   cmp.dj38            Statistics about all trial runs
#   stat.dj38           Raw statistics
#   
#   Learn more: run 'demo help output'

/root/bin/acotsp \
    -i /root/data/cities/djibouti/dj38.tsp \
    --mmas \
    --tries 1 \
    --time 5
