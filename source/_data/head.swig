{% if page.path == 'resume/index.html' %}
  <link rel="stylesheet" href="{{ url_for('/css/resume/index.css') }}">
  <script>
    window.__RESUME_WORLD__ = {{ site.data['resume-world'] | json }};
  </script>
{% endif %}
