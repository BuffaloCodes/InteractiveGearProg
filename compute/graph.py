import json

# Load the JSON file
with open("/home/madssb/interactive-gear-prog/data/sequence.json", "r") as f:
    nested_list = json.load(f)

# Flatten the list
flattened_list = [item for sublist in nested_list for item in sublist]

print(flattened_list)
