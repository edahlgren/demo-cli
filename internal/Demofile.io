demo = 'dm/ant-colony-search'

########################################################
#
# 'demo help input'
#
########################################################

[input]

  [input.tspfile]
  options = ["-i", "--tsplibfile"]
  format = "file.tsp"
  description = "A TSPLIB formatted file containing a graph, where edge weights represent distances between data points (e.g. cities)"
  example = "/root/data/cities/djibouti/dj38.tsp"

########################################################
#
# 'demo help output'
#
########################################################

[output]

  [output.best]
  options = []
  format = "best.DATASET"
  description = "Statistics about the best (shortest) solutions found during each trial run"
  example = ""

  [output.cmp]
  options = []
  format = "cmp.DATASET"
  description = "Statistics about all trial runs"
  example = ""
        
  [output.stat]
  options = []
  file = "stat.DATASET"
  description = "Raw statistics"
  example = ""
