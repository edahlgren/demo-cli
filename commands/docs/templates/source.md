# (source) -

Source code included in this demo

{{#repos}}
## {{name}}

{{description}}

|             |                |
| ----------- | -------------- |
| ___Details  |                |
| Authors     | {{authors}}    |
| Version     | {{version}}    |
| License     | {{license}}    |
| ___Location |                |
| Directory   | {{directory}}  |
| Entrypoint  | {{entrypoint}} |

### Notable files

|           |          |                 |
| --------- | -------- | --------------- |
{{#notable}}
| ({{tag}}) | {{file}} | {{description}} |
{{/notable}}
{{/repos}}
