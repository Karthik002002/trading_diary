import wretch from "wretch";
import QueryStringAddon from "wretch/addons/queryString";

const api = wretch().addon(QueryStringAddon);

export default api;

