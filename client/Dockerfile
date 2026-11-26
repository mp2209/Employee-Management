# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
# Create React App inlines REACT_APP_* variables at build time.
ARG REACT_APP_API_GATEWAY_URL=http://localhost:8080
ARG REACT_APP_STRAVA_CLIENT_ID=
ARG REACT_APP_STRAVA_CLUB_ID=
ARG REACT_APP_STRAVA_REDIRECT_URI=http://localhost:3000/activities
ENV REACT_APP_API_GATEWAY_URL=$REACT_APP_API_GATEWAY_URL \
    REACT_APP_STRAVA_CLIENT_ID=$REACT_APP_STRAVA_CLIENT_ID \
    REACT_APP_STRAVA_CLUB_ID=$REACT_APP_STRAVA_CLUB_ID \
    REACT_APP_STRAVA_REDIRECT_URI=$REACT_APP_STRAVA_REDIRECT_URI
RUN npm run build

FROM nginx:1.28-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
