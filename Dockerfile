FROM node:14.15.4

WORKDIR /code

ENV PORT 5000

COPY package.json /code/package.json

RUN npm install

COPY . /code

CMD [ "node", "App.js"]