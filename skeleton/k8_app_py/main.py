import socket, time, os
from datetime import datetime
from flask import Flask, request

from cpu_stress import CpuStress


ENV = os.environ
VERSION_DEP = ENV['VERSION_DEP'] if 'VERSION_DEP' in ENV else 'local'
APP_PORT = ENV['APP_PORT'] if 'APP_PORT' in ENV else '5000'
HOST = socket.gethostname()

app = Flask(__name__)


@app.route("/")
def app_root():
    gets = request.args
    sleep = gets.get('sleep') if gets.get('sleep') else 0
    cpus = gets.get('cpus') if gets.get('cpus') else None
    date_launch = gets.get('date') if gets.get('date') else None
    time_ini = str(datetime.now())

    # proccess
    if cpus:
        CpuStress(sleep, cpus).run()
    else:
        time.sleep(int(sleep))

    time_end = str(datetime.now())
    response = """
    <pre>
    <b>Hello World!</b>

    version:        {version}
    host_name:      {host}
    ___
    sleep_time:     {sleep}
    stress_cpus:    {cpus_s}
    ___
    date_launch:    {date_launch}
    time_ini:       {time_ini}
    time_end:       {time_end}
    </pre>
    """.format(version=VERSION_DEP, host=HOST, sleep=sleep, cpus_s=cpus,
               date_launch=date_launch, time_ini=time_ini, time_end=time_end)
    
    return response


if __name__ == "__main__":
    app.run(port=APP_PORT)
